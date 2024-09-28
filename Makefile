# Define your virtual environment and flask app
VENV = venv
FLASK_APP = backend/app.py

# Install dependencies
install:
ifeq ($(OS),Windows_NT)
	python -m venv $(VENV)
	$(VENV)\Scripts\pip install -r backend/requirements.txt
	cd frontend && npm install
else
	python -m venv $(VENV)
	$(VENV)/bin/pip install -r backend/requirements.txt
	cd frontend && npm install
endif

# Build the React frontend for production
build-frontend:
	cd frontend && npm run build

# Run the Flask application and serve the built frontend
run:
ifeq ($(OS),Windows_NT)
	cd frontend && npm run build
	venv\Scripts\activate && set FLASK_APP=$(FLASK_APP) && set FLASK_ENV=development && flask run --port 3000
else
	cd frontend && npm run build
	FLASK_APP=$(FLASK_APP) FLASK_ENV=development $(VENV)/bin/flask run --port 3000
endif

# Clean up virtual environment and node_modules
clean:
	rm -rf $(VENV) frontend/node_modules frontend/build

# Reinstall all dependencies
reinstall: clean install
