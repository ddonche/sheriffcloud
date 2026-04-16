FROM debian:trixie-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    unzip \
    nginx \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

COPY . /app

RUN npm install --prefix /app @supabase/supabase-js

RUN chmod +x /app/goblin /app/start.sh /app/sync_portal.sh && \
    ln -sf /app/goblin /usr/local/bin/goblin

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["sh", "/app/start.sh"]
