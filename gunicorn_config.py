import multiprocessing

# Server socket
bind = "127.0.0.1:5000"
backlog = 2048

# Worker processes
workers = 2  # For face recognition, fewer workers to manage memory
worker_class = "sync"
worker_connections = 1000
timeout = 120  # Longer timeout for face processing
keepalive = 5

# Logging
accesslog = "/root/face-recognition-service/logs/access.log"
errorlog = "/root/face-recognition-service/logs/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "face-recognition-service"

# Server mechanics
daemon = False
pidfile = "/root/face-recognition-service/gunicorn.pid"
umask = 0
user = None
group = None
tmp_upload_dir = None
