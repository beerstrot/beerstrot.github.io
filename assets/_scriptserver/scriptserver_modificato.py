import requests, datetime
key = 'BlQgytxF5EBpU5KK7W13c4a742a3vpdtrGuvh3xA' # r/w all

h = {
    'Accept': 'application/json',
    'Authorization': f'Bearer {key}'
}

order = {
    DA MODIFICARE
    'order_items':  (sale_items) [
        {
            'item_id': 954,
            'name': 'Nigiri Special',
            'uuid': '88a11135-f7e1-4f12-b5b0-35715e30b945',
            'net_price': 12.73,
            'vat_perc': 10,
            'final_price': 28,
            'final_net_price': 25.46,
            'notes': '',
            'price': 14,
            'quantity': 2,
            'category_id': 37,
            'category_name': 'Sushi Signatures',


            DA MODIFICARE:
            'operator_id' (seller_id): 0, 
            'operator_name' (seller_name): 'Ordini da Web' 


            DA AGGIUNGERE
            'type': "sale",
            "exit": "1",  


            DA AGGIUNGERE - FORSE BASTA NON METTERLE
            "department_id": "3",  
            "department_name": "VAT 10% - Services",  
            

        }
    ],

    DA MODIFICARE
    'order_customer' (sale_customer): {
        'email': 'renato@junto.space',
        'first_name': 'Renato',
        'last_name': 'Fabbri',
        'mobile': '3515685557'
    },

    DA MODIFICARE
    'type' (order_type): 'take_away', 

    'status': 'open',
    'name': 'EXAMPLE - Renato Fabbri',

    DA MODIFICARE
    'operator_id' (seller_id): 0,   
    'operator_name' (seller_name): 'Ordini da Web' 

    DA AGGIUNGERE
    "auto_print_order": true,
    "currency": "EUR",


    'open_at': '2023-04-27T18:49:56.035080',
    'deliver_at': '2023-04-27T18:45:00.000000Z'
}

resp = requests.post(

    DA MODIFICARE
    'https://api.tilby.com/v2/orders' ('https://api.tilby.com/v2/sales'),
    
    json=order,
    headers=h,
)