import uuid 

def generate_worker_name():
    return f"worker-{uuid.uuid4()}"