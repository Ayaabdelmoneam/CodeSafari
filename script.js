// Handle navigation item clicks
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default link behavior
      
      // Remove active class from all items
      document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Get the page id from the item's data attribute
      const pageId = item.getAttribute('data-page');
      showPage(pageId);
    });
  });
  
  // Function to show the selected page
  function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
      selectedPage.classList.add('active');
    }
  }
