# Code Safari

## Project Structure

- `index.html` - Main entry point of the application
- `login.html` - User login page
- `signup.html` - User registration page
- `html.html` - Contains the main functions of our project including courses and learning features
- `auth.js` - Authentication related JavaScript
- `script.js` - Main JavaScript functionality for html page
- `script_index.js` - JavaScript specific to the index page
- `style.css` - Main CSS styles
- `style_main.css` - CSS specific to the html page
- `styles_index.css` - CSS specific to the index page

## Running the Application

This application uses Python's built-in HTTP server for development. To run the application:

```bash
python -m http.server 5500
```

Then open your browser and navigate to:
```
http://localhost:5500
```

## Firebase Integration

This project is configured to work with Firebase for authentication and data storage. Make sure to set up your Firebase project and update the configuration in the appropriate files.

## Requirements

No external Python packages are required to run the development server. The application uses:

- Python 3.x (for the development server)
