#!/bin/bash

cd frontend
npm run build
cd ..
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
