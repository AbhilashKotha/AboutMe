async function convertRdfaToJsonLd(html) {
    const dom = new DOMParser().parseFromString(html, 'text/html');

    const jsonld = [];
    const properties = {};

    function processRdfaElement(element) {
        function getValue(element) {
            const value = element.textContent.trim();
            if (value) {
                return value;
            }
        }

        function valueToJsonLd(value) {
            return {
                '@value': value,
                '@language': 'en'
            };
        }

        if (element.hasAttribute('typeof') && element.hasAttribute('property')) {
            const property = element.getAttribute('property');
            const propertyName = property.split(':')[1];
            const fullProperty = `http://schema.org/${propertyName}`;

            const id = `_:b${jsonld.length}`;

            properties[fullProperty] = [{ '@id': id }];

            const idObj = {
                
                [fullProperty]: [
                    {
                        '@id': id
                    }
                ]
            };

            jsonld.push(idObj);
        } else if (element.hasAttribute('property')) {
            const property = element.getAttribute('property');
            const propertyName = property.split(':')[1];
            const fullProperty = `http://schema.org/${propertyName}`;
            const value = getValue(element, fullProperty);

            if (!properties[fullProperty]) {
                properties[fullProperty] = [];
            }

            properties[fullProperty].push(valueToJsonLd(value));
        } else if (element.hasAttribute('typeof')) {
            const type = element.getAttribute('typeof');
            const typeName = type.split(':')[1];
            const fullType = `http://schema.org/${typeName}`;
            const obj = { '@type': [fullType] };
            jsonld.push(obj);
        }
    }

    dom.querySelectorAll('[property],[typeof]').forEach(element => {
        processRdfaElement(element);
    });

    Object.keys(properties).forEach(prop => {
        jsonld.push({
          [prop]: properties[prop].map(value => {
            return {
              '@value': value['@value'],
              '@language': value['@language']
            };
          })
        });
      });

    return JSON.stringify(jsonld, null, 2);
}

async function convertFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const htmlContent = e.target.result;
        const jsonld = await convertRdfaToJsonLd(htmlContent);
        const fileName = file.name;
        const outputFileName = fileName.replace('.html', '_output.jsonld');
        const blob = new Blob([jsonld], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = outputFileName;
        link.click();
        URL.revokeObjectURL(link.href);
      };
      reader.readAsText(file);
    } else {
      alert('No file selected.');
    }
  }