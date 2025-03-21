let isActivated = false;
let highlightCircle = null;

// Load activation state and settings from storage when the content script runs
chrome.storage.sync.get(['isActivated', 'selectedThickness', 'selectedColor'], (data) => {
  isActivated = data.isActivated || false; // Default to false if not set
  const thickness = data.selectedThickness || 2; // Default thickness
  const color = data.selectedColor || '#FFFFFF'; // Default color

  // Create the highlight circle with initial settings
  createHighlightCircle(thickness, color);
});

// Function to create the highlight circle
function createHighlightCircle(thickness, color) {
  highlightCircle = document.createElement("div");
  highlightCircle.style.position = "absolute";
  highlightCircle.style.width = "50px"; // Default size
  highlightCircle.style.height = "50px";
  highlightCircle.style.borderRadius = "50%"; // Makes it a circle
  highlightCircle.style.pointerEvents = "none";
  highlightCircle.style.zIndex = "9999"; // Ensure it appears on top
  highlightCircle.style.transition = "top 0.1s ease, left 0.1s ease"; // Smooth movement
  highlightCircle.style.background = "rgba(0, 0, 0, 0.3)"; // Semi-transparent black tint inside
  highlightCircle.style.boxShadow = `0 0 25px 10px ${color}`; // Outer glow with selected color
  highlightCircle.style.border = `${thickness}px solid rgb(255, 255, 255)`; // Border thickness and color
  highlightCircle.style.mixBlendMode = "difference"; // This makes the colors invert dynamically
  highlightCircle.style.display = "none"; // Initially hidden
  document.body.appendChild(highlightCircle);
}

// Function to update the border thickness of the highlight circle
function updateBorderThickness(thickness) {
  if (highlightCircle) {
    highlightCircle.style.border = `${thickness}px solid rgba(255, 255, 255, 1)`;
  }
}

// Function to update the outer glow color of the highlight circle
function updateOuterGlowColor(color) {
  if (highlightCircle) {
    highlightCircle.style.boxShadow = `0 0 25px 10px ${color}`; // Update outer glow color
  }
}

// Function to update the border color of the highlight circle
function updateBorderColor(color) {
  if (highlightCircle) {
    highlightCircle.style.borderColor = color;
  }
}

// Store the original font size of the last focused element
let lastFocusedElement = null;
let originalFontSize = "";

// Function to reset text size of previously focused element
function resetTextSize() {
  if (lastFocusedElement) {
    lastFocusedElement.style.fontSize = originalFontSize;
  }
}

// Function to update circle position based on selected element
function updateHighlightCircle(element) {
  if (!element) return;

  let rect = element.getBoundingClientRect();
  let circleSize = Math.max(rect.width, rect.height, 50); // Ensures visibility

  highlightCircle.style.width = circleSize + "px";
  highlightCircle.style.height = circleSize + "px";
  highlightCircle.style.top = window.scrollY + rect.top + rect.height / 2 - circleSize / 2 + "px";
  highlightCircle.style.left = window.scrollX + rect.left + rect.width / 2 - circleSize / 2 + "px";

  highlightCircle.style.display = "block";

  // Reset previous text size
  resetTextSize();

  // Apply text size enhancement to the new focused element
  if (element && element.innerText.trim() !== "") {
    originalFontSize = window.getComputedStyle(element).fontSize;
    element.style.transition = "font-size 0.2s ease";
    element.style.fontSize = "1.5em"; // Increase font size
    lastFocusedElement = element;
  }
}

// Function to check if an element is visible
function isVisible(element) {
  if (!element) return false;
  let rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    window.getComputedStyle(element).display !== "none" &&
    window.getComputedStyle(element).visibility !== "hidden"
  );
}

// Function to get the nearest visible element in a given direction
function getNearestElement(currentElement, direction) {
  if (!currentElement) return null;

  let rect = currentElement.getBoundingClientRect();
  let allElements = [...document.querySelectorAll("a, button, input, textarea, select, [tabindex]")].filter(isVisible);

  let closestElement = null;
  let closestDistance = Infinity;

  allElements.forEach((el) => {
    if (el === currentElement) return;

    let elRect = el.getBoundingClientRect();
    let distance = Math.hypot(rect.left - elRect.left, rect.top - elRect.top);

    if (direction === "right" && elRect.left > rect.right) {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
      }
    } else if (direction === "left" && elRect.right < rect.left) {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
      }
    } else if (direction === "down" && elRect.top > rect.bottom) {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
      }
    } else if (direction === "up" && elRect.bottom < rect.top) {
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
      }
    }
  });

  return closestElement;
}

// Listen for directional shortcuts (Ctrl + Arrow Keys)
document.addEventListener("keydown", (event) => {
  if (isActivated && event.ctrlKey) {
    let activeElement = document.activeElement;
    let newElement = null;

    if (event.key === "ArrowRight") {
      newElement = getNearestElement(activeElement, "right");
    } else if (event.key === "ArrowLeft") {
      newElement = getNearestElement(activeElement, "left");
    } else if (event.key === "ArrowDown") {
      newElement = getNearestElement(activeElement, "down");
    } else if (event.key === "ArrowUp") {
      newElement = getNearestElement(activeElement, "up");
    }

    if (newElement) {
      newElement.focus();
      updateHighlightCircle(newElement);
      event.preventDefault(); // Prevent default page scrolling
    }
  }
});

// Listen for tab navigation to update circle position
document.addEventListener("keydown", (event) => {
  if (isActivated && event.key === "Tab") {
    setTimeout(() => {
      let activeElement = document.activeElement;
      if (activeElement && activeElement.tagName !== "BODY") {
        updateHighlightCircle(activeElement);
      } else {
        highlightCircle.style.display = "none";
        resetTextSize();
      }
    }, 50); // Small delay to allow focus update
  }
});

// Hide the highlight when clicking elsewhere
document.addEventListener("click", () => {
  if (isActivated) {
    highlightCircle.style.display = "none";
    resetTextSize();
  }
});

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleActivation') {
    isActivated = message.isActive;
    if (!isActivated) {
      highlightCircle.style.display = "none";
      resetTextSize();
    }
  } else if (message.action === 'updateThickness') {
    updateBorderThickness(message.thickness);
  } else if (message.action === 'updateColor') {
    updateOuterGlowColor(message.color); // Update outer glow color
    updateBorderColor(message.color); // Update border color (optional)
  }
});