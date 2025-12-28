// validation.js - Small form validation helpers used by Login/Signup pages.
export const validateEmail = (email) => {
  // Proper email validation: prevents numbers/special chars after domain extension
  const regex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateName = (name) => {
  return name.trim().length >= 2;
};

export const validateSignupForm = (form) => {
  const errors = [];
  
  if (!form.name || !validateName(form.name)) {
    errors.push("Name must be at least 2 characters");
  }
  if (!form.email || !validateEmail(form.email)) {
    errors.push("Please enter a valid email address");
  }
  if (!form.password || !validatePassword(form.password)) {
    errors.push("Password must be at least 6 characters");
  }
  
  return errors;
};

export const validateLoginForm = (form) => {
  const errors = [];
  
  if (!form.email || !validateEmail(form.email)) {
    errors.push("Please enter a valid email address");
  }
  if (!form.password) {
    errors.push("Password is required");
  }
  
  return errors;
};
