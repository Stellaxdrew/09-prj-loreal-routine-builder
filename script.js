/* Get references to important elements in the HTML */
const categoryFilter = document.getElementById("categoryFilter"); // Dropdown for product categories
const productsContainer = document.getElementById("productsContainer"); // Where products are shown
const chatForm = document.getElementById("chatForm"); // Chat form for user questions
const chatWindow = document.getElementById("chatWindow"); // Chat window for AI responses
const selectedProductsList = document.getElementById("selectedProductsList"); // Shows selected products

/* This array will hold all products the user selects */
let selectedProducts = [];

/* Show a placeholder message until the user picks a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from a local JSON file using async/await */
let allProducts = []; // Store all loaded products
async function loadProducts() {
  const response = await fetch("products.json"); // Get the file
  const data = await response.json(); // Convert to JS object
  allProducts = data.products; // Save all products for filtering
  return allProducts; // Return the array of products
}

/* Load selected products from localStorage so user's choices are remembered */
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProducts"); // Get saved data
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved); // Convert to JS array
    } catch {
      selectedProducts = []; // If error, start with empty array
    }
  }
}

/* Save selected products to localStorage so user's choices persist */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Show selected products below the grid, with remove and clear buttons */
function updateSelectedProductsList() {
  // Create HTML for each selected product
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-card" data-name="${product.name}">
        <img src="${product.image}" alt="${product.name}">
        <div>
          <strong>${product.name}</strong>
          <div>${product.brand}</div>
        </div>
        <button class="remove-selected-btn" title="Remove">
          &times;
        </button>
      </div>
    `
    )
    .join("");

  // Remove any existing clear button before adding a new one
  const parent = selectedProductsList.parentElement;
  const oldClearBtn = parent.querySelector(".clear-selected-btn");
  if (oldClearBtn) oldClearBtn.remove();

  // Add "Clear All" button only once, below the list
  if (selectedProducts.length > 0) {
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear All";
    clearBtn.className = "clear-selected-btn";
    clearBtn.type = "button";
    clearBtn.style.marginLeft = "0";
    clearBtn.style.marginTop = "12px";
    clearBtn.onclick = () => {
      selectedProducts = [];
      saveSelectedProducts();
      updateSelectedProductsList();
      // Re-render products grid to remove highlights
      const selectedCategory = categoryFilter.value;
      loadProducts().then((products) => {
        const filteredProducts = products.filter(
          (product) => product.category === selectedCategory
        );
        displayProducts(filteredProducts);
      });
    };
    parent.appendChild(clearBtn);
  }

  // Add event listeners to remove buttons for each selected product
  const removeBtns = selectedProductsList.querySelectorAll(
    ".remove-selected-btn"
  );
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      const card = btn.closest(".selected-product-card");
      const productName = card.getAttribute("data-name");
      // Remove product from selectedProducts array
      selectedProducts = selectedProducts.filter((p) => p.name !== productName);
      saveSelectedProducts(); // Save changes
      updateSelectedProductsList(); // Update UI
      // Also update product grid to remove highlight
      const selectedCategory = categoryFilter.value;
      loadProducts().then((products) => {
        const filteredProducts = products.filter(
          (product) => product.category === selectedCategory
        );
        displayProducts(filteredProducts);
      });
    });
  });
}

/* Show product description in a modal window */
function showProductModal(product) {
  // Create modal HTML
  const modal = document.createElement("div");
  modal.className = "product-modal";
  modal.innerHTML = `
    <div class="product-modal-content" role="dialog" aria-modal="true" aria-label="${
      product.name
    } Description">
      <button class="product-modal-close" aria-label="Close">&times;</button>
      <h2>${product.name}</h2>
      <img src="${product.image}" alt="${
    product.name
  }" style="max-width:120px; margin-bottom:12px;">
      <p><strong>Brand:</strong> ${product.brand}</p>
      <p><strong>Description:</strong></p>
      <p>${product.description || "No description available."}</p>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal when user clicks close button or outside the modal
  modal.querySelector(".product-modal-close").onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      // Check if product is selected
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      // Create HTML for each product card
      return `
        <div class="product-card${isSelected ? " selected" : ""}" data-name="${
        product.name
      }">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
          <button class="description-btn" type="button">Description</button>
        </div>
      `;
    })
    .join("");

  // Add event listeners to product cards and description buttons
  const productCards = productsContainer.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    // Single click on card: add/remove product from selected list
    card.addEventListener("click", (event) => {
      // If the description button was clicked, do not toggle selection
      if (event.target.classList.contains("description-btn")) return;
      const productName = card.getAttribute("data-name");
      const productObj = products.find((p) => p.name === productName);
      const alreadySelected = selectedProducts.some(
        (p) => p.name === productName
      );
      if (alreadySelected) {
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== productName
        );
      } else {
        selectedProducts.push(productObj);
      }
      saveSelectedProducts(); // Save changes to localStorage
      displayProducts(products); // Update product grid
      updateSelectedProductsList(); // Update selected list
    });

    // Click on description button: show modal
    const descBtn = card.querySelector(".description-btn");
    descBtn.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent card selection
      const productName = card.getAttribute("data-name");
      const productObj = products.find((p) => p.name === productName);
      showProductModal(productObj); // Show modal window
    });
  });
}

// Helper to filter products by category and search term
function getFilteredProducts(category, searchTerm) {
  let products = allProducts;
  if (category) {
    products = products.filter((product) => product.category === category);
  }
  if (searchTerm) {
    const term = searchTerm.trim().toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.description &&
          product.description.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term))
    );
  }
  return products;
}

// Listen for changes to category filter
categoryFilter.addEventListener("change", async (e) => {
  const selectedCategory = e.target.value;
  // If products not loaded yet, load them
  if (allProducts.length === 0) {
    await loadProducts();
  }
  // Get current search term
  const searchTerm = document.getElementById("productSearch").value;
  filteredProducts = getFilteredProducts(selectedCategory, searchTerm);
  displayProducts(filteredProducts);
});

// Listen for input in the search field
const productSearch = document.getElementById("productSearch");
productSearch.addEventListener("input", async (e) => {
  const searchTerm = e.target.value;
  // Get current category
  const selectedCategory = categoryFilter.value;
  // If products not loaded yet, load them
  if (allProducts.length === 0) {
    await loadProducts();
  }
  filteredProducts = getFilteredProducts(selectedCategory, searchTerm);
  displayProducts(filteredProducts);
});

// On page load, load products and show initial grid (if category selected)
(async function () {
  await loadProducts();
  // If a category is selected, show filtered products
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value;
  filteredProducts = getFilteredProducts(selectedCategory, searchTerm);
  if (selectedCategory) {
    displayProducts(filteredProducts);
  }
})();

// Store the full conversation history for the chat
let conversationHistory = [];

// Helper function to render chat history as bubbles
function renderChatHistory() {
  chatWindow.innerHTML = conversationHistory
    .filter((msg, idx) => {
      // Skip the very first user message (idx === 1)
      if (idx === 1 && msg.role === "user") return false;
      return msg.role === "user" || msg.role === "assistant";
    })
    .map((msg) => {
      const roleClass = msg.role === "user" ? "user" : "ai";
      // For AI, split into multiple bubbles if needed
      if (msg.role === "assistant") {
        const bubbles = formatAIResponse(msg.content);
        return bubbles
          .map(
            (bubble) => `<div class="chat-bubble ${roleClass}">${bubble}</div>`
          )
          .join("");
      }
      // For user, just one bubble
      return `<div class="chat-bubble ${roleClass}">${msg.content}</div>`;
    })
    .join("");
}

// Helper function to format AI response into multiple chat bubbles
function formatAIResponse(content) {
  // Add spacing and emojis for fun and clarity
  // Split by newlines, steps, or bullet points
  const lines = content.split(/\n+/).filter((line) => line.trim() !== "");
  const bubbles = [];
  lines.forEach((line) => {
    // Add emoji for step/routine lines
    if (/^\d+\./.test(line)) {
      bubbles.push(`💡 ${line}`);
    } else if (/^- /.test(line)) {
      bubbles.push(`🔹 ${line.replace(/^- /, "")}`);
    } else if (/routine|step|tips|advice/i.test(line)) {
      bubbles.push(`✨ ${line}`);
    } else {
      bubbles.push(line);
    }
  });
  return bubbles;
}

// Get reference to the "Generate Routine" button
const generateRoutineBtn = document.getElementById("generateRoutine");

// Add event listener for generating routine
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      "<div>Please select products before generating a routine.</div>";
    return;
  }

  // Prepare the data to send to the AI (only the needed fields)
  const productsForAI = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // Use a system prompt that requests current info, links, and citations
  conversationHistory = [
    {
      role: "system",
      content:
        "You are a helpful beauty routine assistant with access to real-time web search. When answering, include current information, links, and citations about L'Oréal products or routines if available. Be clear, concise, and friendly for beginners. Keep responses short and easy to read.",
    },
    {
      role: "user",
      content: `Here are my selected products:\n${JSON.stringify(
        productsForAI,
        null,
        2
      )}\nPlease generate a routine using these products.`,
    },
  ];

  chatWindow.innerHTML = `<div class="chat-bubble ai"><em>Generating your routine...</em></div>`;

  try {
    // Use the browsing-enabled model
    const response = await fetch(
      "https://loral-chatbot.stella-nyangamoi.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-browsing", // Use a model that supports web search
          messages: conversationHistory,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML += `<div class="chat-bubble ai">Sorry, something went wrong. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div class="chat-bubble ai">Error: ${error.message}</div>`;
  }
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  // Clear the input field after sending
  document.getElementById("userInput").value = "";
  // Optionally, reset form for accessibility
  chatForm.reset();

  // Add user's question to the conversation history
  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  renderChatHistory(); // Show updated chat

  chatWindow.innerHTML += `<div class="chat-bubble ai"><em>Thinking...</em></div>`;

  try {
    // Use the browsing-enabled model
    const response = await fetch(
      "https://loral-chatbot.stella-nyangamoi.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-browsing", // Use a model that supports web search
          messages: conversationHistory,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML += `<div class="chat-bubble ai">Sorry, something went wrong. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div class="chat-bubble ai">Error: ${error.message}</div>`;
  }
});

/* On page load, restore selected products from localStorage */
loadSelectedProducts();
updateSelectedProductsList();
loadSelectedProducts();
updateSelectedProductsList();
loadSelectedProducts();
updateSelectedProductsList();
loadSelectedProducts();
updateSelectedProductsList();
