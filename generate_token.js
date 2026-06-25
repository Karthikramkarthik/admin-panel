const jwt = require('../backend/node_modules/jsonwebtoken');
const payload = {
  id: 6,
  username: 'karthik',
  email: 'karthik@gmail.com',
  role: 'Inventory Manager',
  roleId: 6
};
const token = jwt.sign(
  payload,
  'stock_management_jwt_secret_key_2026',
  { expiresIn: '8h' }
);
console.log(token);
