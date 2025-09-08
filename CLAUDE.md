# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D OBJ Point Identifier project designed to create an interactive web-based viewer for OBJ mesh files. The main goal is to allow users to:

- Import and display OBJ files containing 3D meshes
- Rotate and navigate around the 3D model interactively  
- Manually select individual vertices with visual highlighting
- Display the vertex indices/numbers of selected points in real-time

## Sample Data

The repository contains `smplx_0060.obj` - a sample OBJ file with vertex data that can be used for testing and validation of the viewer functionality.

## Architecture Notes

This is a new project that needs to be built from scratch. Based on the requirements:

- Target: Cross-platform web application
- 3D rendering requirement suggests Three.js or similar WebGL library
- Interactive vertex selection requires raycasting functionality
- Real-time UI updates for displaying vertex indices
- OBJ file loading and parsing capabilities needed

The project description is in Chinese/English mixed format in `project_description.txt`.