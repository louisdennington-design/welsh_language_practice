from flask import Flask, render_template, jsonify, session, request
import json
import random
import os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

def load_vocabulary():
    """Load vocabulary from JSON file"""
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Return sample data if file doesn't exist
        return {
            "words": [
                {"english": "hello", "welsh": "helo"},
                {"english": "goodbye", "welsh": "hwyl fawr"},
                {"english": "thank you", "welsh": "diolch"},
                {"english": "water", "welsh": "dŵr"},
                {"english": "food", "welsh": "bwyd"}
            ]
        }

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/api/word')
def get_word():
    """Get next random word that hasn't been shown in this session"""
    vocabulary = load_vocabulary()
    words = vocabulary['words']
    
    # Initialize session tracking
    if 'presented_words' not in session:
        session['presented_words'] = []
    
    # If all words have been presented, reset the session
    if len(session['presented_words']) >= len(words):
        session['presented_words'] = []
    
    # Find words not yet presented
    available_words = [
        word for i, word in enumerate(words) 
        if i not in session['presented_words']
    ]
    
    if not available_words:
        return jsonify({"error": "No words available"}), 404
    
    # Select random word from available ones
    selected_word = random.choice(available_words)
    word_index = words.index(selected_word)
    
    # Mark as presented
    session['presented_words'].append(word_index)
    session.modified = True
    
    return jsonify({
        "english": selected_word["english"],
        "welsh": selected_word["welsh"],
        "remaining": len(words) - len(session['presented_words'])
    })

@app.route('/api/reset-session', methods=['POST'])
def reset_session():
    """Reset the current session"""
    session['presented_words'] = []
    return jsonify({"message": "Session reset successfully"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
