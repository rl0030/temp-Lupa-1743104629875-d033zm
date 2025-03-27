const validateEmail = (email: string ) => {
    // Regular expression pattern for email validation
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  
    // Check if the email matches the pattern
    if (email.match(emailPattern)) {
      return true; // Email is valid
    } else {
      return false; // Email is invalid
    }
  };

  export { validateEmail }