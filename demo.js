const bcrypt = require("bcrypt");

const hash = "$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq";

bcrypt.compare("password", hash).then(result => {
  console.log(result); // true o false
});
