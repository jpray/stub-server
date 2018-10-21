/**
 * @param stubs
 * @returns {String} stubName
 */
export default function pickDefaultStub(stubs) {
    // some logic to select the default stub
    // first, see if there is a stub named 'default'
    // else,  see if there is a stub named '0'
    // else,  see if there is a stub named 'success'
    // else,  use the first one in the list
    var defaultNames = [
        'default.json',
        '0.json',
        'success.json'
    ];

    stubs = stubs.filter(function(fileName) {
        return fileName.indexOf('.hooks.js') === -1;
    })

    for (var i=0; i<defaultNames.length; i++) {
        let name = defaultNames[i];
        if (!!~stubs.indexOf(name)) {
            return name;
        }
    }

    // no stub found... use the first on in the list
    return stubs[0];
}
