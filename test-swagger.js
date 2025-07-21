const express = require('express');
const { setupSwagger } = require('./dist/config/swagger');

const app = express();

// Setup Swagger
try {
  setupSwagger(app);
  console.log('✅ Swagger setup successful!');
  console.log('📚 API Documentation available at: http://localhost:5000/api-docs');
  console.log('📄 OpenAPI Spec available at: http://localhost:5000/api-docs.json');
} catch (error) {
  console.error('❌ Swagger setup failed:', error.message);
  process.exit(1);
}

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log('Visit http://localhost:5000/api-docs to view the documentation');
  
  // Auto-shutdown after 5 seconds for testing
  setTimeout(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  }, 5000);
});