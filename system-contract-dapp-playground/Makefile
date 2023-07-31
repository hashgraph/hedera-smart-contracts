
# clean up environment then reinstall dependencies
.PHONY: clean
clean: 
	@echo Deep cleanning project environment...
	@echo Purging .next...
	@rm -fr .next
	@echo Purging .vscode...
	@rm -fr .vscode
	@echo Purging node_modules...
	@rm -fr node_modules
	@echo Reinstalling dependencies modules...
	npm install

# run project in dev mode
dev:
	npm run dev

# clean environment then run project in dev mode
dev-clean: clean dev

# create production-ready build
build:
	@echo Creating production-ready build...
	npm run build

# create and run production build
production: build
	@echo Starting production Syns client app...
	npm run start

# clean environment then create and run production build
production-clean: clean production

# lints codebase
lint:
	npm run lint

# format all files
format-codebase:
	npx prettier . --write

# assure all files are formatted
format-check:
	npx prettier . --check
