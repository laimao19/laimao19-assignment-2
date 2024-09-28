# KMeans Clustering Visualization with Flask Backend

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/yourusername/yourrepo/python-app.yml?branch=main)

Welcome to my **KMeans Clustering Visualization**! This webpage allows you to visualize KMeans clustering algorithms with dynamic centroids and data points on the frontend, while the backend runs a Flask server to handle the clustering logic. The visualization is built with React and D3.js, and the backend is powered by Python and Flask.

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [Running the Project Locally](#usage)

  
## Features
- **Interactive KMeans clustering visualization** with customizable cluster initialization methods (Random, Farthest First, KMeans++, Manual).
- **Frontend built with React and D3.js** for smooth animations and rendering of clusters and centroids.
- **Backend using Flask** to handle KMeans computations.
- **Fully tested CI pipeline** with GitHub Actions.

## Technologies
- **Frontend**: React, D3.js, HTML, CSS
- **Backend**: Flask, Python
- **Node.js**: For managing the frontend build
- **GitHub Actions**: For continuous integration and testing

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
Make sure you have the following installed:
- **Python 3.10+**
- **Node.js 16+**
- **Make** (for running Makefile commands)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/laimao19/laimao19-assignment-2.git
   cd laimao19-assignment-2
2. **Install dependencies**:
   ```bash
   make install
3. **Run the application**:
   ```bash
   make run

### Usage
Once the server is running, open your web browser and navigate to:
http://localhost:3000
From here, you can interact with the KMeans clustering visualization.
