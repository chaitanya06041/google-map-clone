function autocomplete(inputElement, suggestionsElement) {
    inputElement.addEventListener('input', function () {
        const query = inputElement.value;
        if (query.length < 3) {
            suggestionsElement.innerHTML = '';
            return; // Only show suggestions when the input length is 3 or more characters
        }

        getPlaceSuggestions(query, function (places) {
            suggestionsElement.innerHTML = '';
            places.forEach(place => {
                const suggestion = document.createElement('div');
                suggestion.textContent = place.display_name;
                suggestion.addEventListener('click', function () {
                    inputElement.value = place.display_name;
                    suggestionsElement.innerHTML = ''; // Clear suggestions
                });
                suggestionsElement.appendChild(suggestion);
            });
        });
    });
}


autocomplete(document.getElementById('source'), document.getElementById('sourceSuggestions'));
autocomplete(document.getElementById('destination'), document.getElementById('destinationSuggestions'));