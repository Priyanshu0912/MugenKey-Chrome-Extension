// DOM Elements
const colorPicker = document.getElementById('colorPicker');
const colorValue = document.getElementById('colorValue');
const thicknessSlider = document.getElementById('thicknessSlider');
const thicknessValue = document.getElementById('thicknessValue');
const previewShape = document.getElementById('previewShape');
const activationButton = document.getElementById('activationToggle');
const activationIcon = document.getElementById('activationIcon');

// Load saved settings from storage
chrome.storage.sync.get(['selectedColor', 'selectedThickness', 'isActivated'], (data) => {
  const savedColor = data.selectedColor || '#000000';
  const savedThickness = data.selectedThickness || 2;
  const isActivated = data.isActivated || false; // Default to false if not set

  // Apply saved values
  colorPicker.value = savedColor;
  colorValue.textContent = savedColor.toUpperCase();
  thicknessSlider.value = savedThickness;
  thicknessValue.textContent = `${savedThickness}px`;
  activationButton.classList.toggle('active', isActivated); // Set button state based on saved value

  updatePreview(savedColor, savedThickness);
});

// Update preview shape
function updatePreview(color = colorPicker.value, thickness = thicknessSlider.value) {
  previewShape.style.width = `${thickness * 6}px`;
  previewShape.style.height = `${thickness * 6}px`;
  previewShape.style.backgroundColor = color;
}

// Color picker event listener
colorPicker.addEventListener('input', (e) => {
  const newColor = e.target.value;
  colorValue.textContent = newColor.toUpperCase();
  updatePreview(newColor, thicknessSlider.value);

  // Save color to storage
  chrome.storage.sync.set({ selectedColor: newColor });

  // Send color update to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateColor', color: newColor });
  });
});

// Thickness slider event listener
thicknessSlider.addEventListener('input', (e) => {
  const newThickness = parseInt(e.target.value);
  thicknessValue.textContent = `${newThickness}px`;
  updatePreview(colorPicker.value, newThickness);

  // Save thickness to storage
  chrome.storage.sync.set({ selectedThickness: newThickness });

  // Send thickness update to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateThickness', thickness: newThickness });
  });
});

// Toggle Activation State
activationButton.addEventListener('click', () => {
  const isActive = activationButton.classList.toggle('active');

  // Save activation state to storage
  chrome.storage.sync.set({ isActivated: isActive });

  // Send a message to the content script to enable/disable functionality
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleActivation', isActive });
  });
});