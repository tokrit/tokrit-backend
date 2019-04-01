# Install Project
install:
	npm install

# Run react.js project: Serves on localhost:3000
run: node_modules/ index.js
	node index.js

# Cleanup product of make install
clean:
	rm -rf node_modules
