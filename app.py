from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# CORS mais permissivo para desenvolvimento
CORS(app)


# Dados dos produtos - ATUALIZADO PARA LAV SMARTCLEAN 2.1
products = [
    {
        'id': 1,
        'name': 'Lav SmartClean 2.1',
        'description': 'Ideal para indústrias de pequeno a grande porte.',
        'price': 40000.00,
        'image': 'https://via.placeholder.com/300x200?text=Lav+SmartClean+2.1'
    }
]


@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'API funcionando'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)