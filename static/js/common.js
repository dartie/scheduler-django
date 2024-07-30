/* AJAX definition */
function AJAX(url, data, method='GET', async=true){
    return new Promise(function(resolve, reject) {
        var formData = new FormData();

        for (var key in data) {
            // check if the property/key is defined in the object itself, not in parent
            if (data.hasOwnProperty(key)) {
                formData.append(key, data[key]);
            }
        }

        var xhr = new XMLHttpRequest();

        // Add any event handlers here...
        xhr.onload = function() {
            resolve(this.responseText);
        };
        xhr.onerror = reject;

        xhr.open(method, url, async);
        xhr.send(formData);
        //return false; // To avoid actual submission of the form
    });
}
