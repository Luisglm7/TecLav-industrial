from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# CORS mais permissivo para desenvolvimento
CORS(app)

# VARIÁVEIS DE FRETE
BASE_FREIGHT_COST = 50.00
COST_PER_KM = 1.50

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

# Função de Cálculo de Frete (Simulação da Transportadora)
def calculate_freight_cost(distance_km):
    if distance_km is None or distance_km <= 0:
        return BASE_FREIGHT_COST # Retorna apenas o custo fixo se a distância for zero ou inválida
    
    freight = BASE_FREIGHT_COST + (distance_km * COST_PER_KM)
    return round(freight, 2)

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'API funcionando'})

@app.route('/api/freight', methods=['GET'])
def get_freight_cost():
    """Calcula o frete baseado na distância fornecida via parâmetro URL."""
    try:
        # Pega a distância do parâmetro 'distance' na URL
        distance_str = request.args.get('distance')
        if not distance_str:
            return jsonify({'error': 'Parâmetro "distance" é obrigatório.'}), 400
        
        distance_km = float(distance_str)
        
        freight_cost = calculate_freight_cost(distance_km)
        
        return jsonify({
            'distance_km': distance_km,
            'base_cost': BASE_FREIGHT_COST,
            'cost_per_km': COST_PER_KM,
            'freight_cost': freight_cost
        })
        
    except ValueError:
        return jsonify({'error': 'O parâmetro "distance" deve ser um número válido.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)