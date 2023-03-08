IMAGE?=ipedrazas/letsencrypt
TAG?=latest

BUILDER=buildx-multi-arch

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

build: ## Build service image to be deployed as a desktop extension
	docker build --tag=$(IMAGE):$(TAG) .

install: build ## Install the extension
	docker extension install $(IMAGE):$(TAG)

update: build ## Update the extension
	docker extension update $(IMAGE):$(TAG)

prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

push: prepare-buildx ## Build & Upload extension image to hub. Do not push if tag already exists: make push-extension tag=0.1
	docker pull $(IMAGE):$(TAG) && echo "Failure: Tag already exists" || docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: help

debug: # Show Chrome-dev tools
	docker extension dev debug $(IMAGE):$(TAG)
debug-reset: # Reset Chrome-dev tools
	docker extension dev reset $(IMAGE):$(TAG)
debug-ui: debug # Set UI hot reload
	docker extension dev ui-source $(IMAGE):$(TAG) http://localhost:3000
ui: debug-ui # Run UI hot reload
	cd ui && npm run dev

test-ingress:
	cat manifests/app.yaml | sed -e 's/{{domain}}/docker.notprod.uk/g' | kubectl apply -f -