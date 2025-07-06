from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Хранение данных в памяти
exercises = []
current_exercise = None
hits = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_exercise', methods=['POST'])
def add_exercise():
    global current_exercise

    exercise_name = request.form.get('name')
    exercise_comment = request.form.get('comment')
    exercise_color = request.form.get('color')

    if exercise_name:
        new_exercise = {
            'id': len(exercises) + 1,
            'name': exercise_name,
            'comment': exercise_comment,
            'color': exercise_color,
            'score': 0,
            'completed': False
        }
        exercises.append(new_exercise)
        current_exercise = new_exercise['id']
        return jsonify({
            'success': True,
            'exercises': exercises,
            'current_exercise': current_exercise
        })
    return jsonify({'success': False})

@app.route('/add_hit', methods=['POST'])
def add_hit():
    if not current_exercise:
        return jsonify({'success': False, 'error': 'No active exercise'})

    x = request.form.get('x')
    y = request.form.get('y')

    if x and y:
        hits.append({
            'exercise_id': current_exercise,
            'x': float(x),
            'y': float(y),
            'color': next(ex['color'] for ex in exercises if ex['id'] == current_exercise)
        })
        return jsonify({'success': True, 'hits': hits})
    return jsonify({'success': False})

@app.route('/complete_exercise', methods=['POST'])
def complete_exercise():
    global current_exercise
    current_exercise = None
    return jsonify({'success': True, 'current_exercise': current_exercise})

@app.route('/clear_exercises', methods=['POST'])
def clear_exercises():
    global exercises, current_exercise, hits
    exercises = []
    current_exercise = None
    hits = []
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)