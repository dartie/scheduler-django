// script.js

document.addEventListener('DOMContentLoaded', function() {
  var selected = document.querySelector('.select-selected');
  var optionsContainer = document.querySelector('.select-items');
  var options = document.querySelectorAll('.select-option');

  selected.addEventListener('click', function() {
    optionsContainer.classList.toggle('select-hide');
    this.classList.toggle('select-arrow-active');
  });

  options.forEach(function(option) {
    option.addEventListener('click', function() {
      selected.innerHTML = this.innerHTML + ' <i class="bi bi-chevron-down select-arrow"></i>';
      selected.setAttribute('data-value', this.getAttribute('data-value')); // Set the value attribute
      optionsContainer.classList.add('select-hide');
    });
  });

  document.addEventListener('click', function(e) {
    if (!e.target.matches('.select-selected')) {
      optionsContainer.classList.add('select-hide');
    }
  });
});

// Function to get the selected value
function getSelectedValue() {
  var selected = document.querySelector('.select-selected');
  return selected.getAttribute('data-value');
}

let select_last_value = ""