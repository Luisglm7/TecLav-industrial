from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# CORS mais permissivo para desenvolvimento
CORS(app)

# Dados dos produtos
products = [
    {
        'id': 1,
        'name': 'Lava-louças industrial P-50',
        'description': 'Ideal para cozinhas de pequeno e médio porte.',
        'price': 30000.00,
        'image': 'https://via.placeholder.com/300x200?text=Modelo+P-50'
    },
]

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'API funcionando'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)