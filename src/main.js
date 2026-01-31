// Main JavaScript file
console.log('Playground app initialized!')

// Get DOM elements
const messageElement = document.getElementById('message')
const clickButton = document.getElementById('clickButton')

// Update message on page load
messageElement.textContent = 'Hello from JavaScript!'

// Add click event listener
let clickCount = 0
clickButton.addEventListener('click', () => {
  clickCount += 1
  messageElement.textContent = `Button clicked ${clickCount} time${clickCount !== 1 ? 's' : ''}!`
  console.log(`Button clicked ${clickCount} times`)
})

// Example function
function greet(name) {
  return `Hello, ${name}!`
}

// Export for potential use in other modules
export { greet }
