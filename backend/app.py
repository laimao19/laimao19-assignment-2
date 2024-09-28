import numpy as np
import os
import random  # Ensure this is imported
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='../frontend/build')

# Generate random data points
@app.route('/generate-data', methods=['GET'])
def generate_data():
    num_points = int(request.args.get('num_points', 100))
    data = np.random.rand(num_points, 2).tolist()
    return jsonify({'data': data})

# KMeans algorithm (step-by-step)
@app.route('/kmeans-step', methods=['POST'])
def kmeans_step():
    data = np.array(request.json['data'])
    k = request.json['k']
    centroids = np.array(request.json['centroids'])

    clusters = [[] for _ in range(k)]
    for point in data:
        distances = [np.linalg.norm(point - centroid) for centroid in centroids]
        cluster = distances.index(min(distances))
        clusters[cluster].append(point.tolist())  # Convert NumPy array to list

    # Recalculate centroids
    new_centroids = []
    for cluster in clusters:
        if cluster:
            new_centroid = np.mean(cluster, axis=0)
            new_centroids.append(new_centroid.tolist())  # Convert NumPy array to list
        else:
            new_centroids.append(random.choice(data).tolist())  # Handle empty clusters

    return jsonify({'clusters': clusters, 'centroids': new_centroids})

# KMeans algorithm (run to convergence)
@app.route('/kmeans-converge', methods=['POST'])
def kmeans_converge():
    data = np.array(request.json['data'])
    k = request.json['k']
    centroids = np.array(request.json['centroids'])

    while True:
        clusters = [[] for _ in range(k)]
        for point in data:
            distances = [np.linalg.norm(point - centroid) for centroid in centroids]
            cluster = distances.index(min(distances))
            clusters[cluster].append(point.tolist())

        new_centroids = []
        for cluster in clusters:
            if cluster:
                new_centroid = np.mean(cluster, axis=0)
                new_centroids.append(new_centroid.tolist())
            else:
                new_centroids.append(random.choice(data).tolist())  # Handle empty clusters

        if np.array_equal(new_centroids, centroids):
            break

        centroids = new_centroids

    return jsonify({'clusters': clusters, 'centroids': centroids})

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
