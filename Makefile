.PHONY: all clean v2 v3 ver

VER := $(shell ./get_version.sh)
V2_NAME := "litera5-browser-$(VER).v2"
V3_NAME := "litera5-browser-$(VER).v3"

all: v2 v3

dist:
	yarn build

clean:
	rm -rf dist
	rm -rf litera5-browser-*

$(V2_NAME): dist
	rsync -avz dist/* $(V2_NAME)
	rm -rf $(V2_NAME)/manifest.json
	mv $(V2_NAME)/manifest.v2.json $(V2_NAME)/manifest.json

$(V3_NAME): dist
	rsync -avz dist/* $(V3_NAME)
	rm -rf $(V3_NAME)/manifest.v2.json

$(V2_NAME).zip: $(V2_NAME)
	cd $(V2_NAME) && zip -r ../$(V2_NAME).zip ./*

$(V3_NAME).zip: $(V3_NAME)
	cd $(V3_NAME) && zip -r ../$(V3_NAME).zip ./*

v2: $(V2_NAME).zip

v3: $(V3_NAME).zip

ver:
	echo $(VER)