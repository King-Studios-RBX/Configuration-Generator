FROM oven/bun:debian

ENV PATH="/root/.bun/bin:${PATH}"
RUN ln -s /usr/local/bin/bun /usr/local/bin/node || true

RUN apt-get update && apt-get install -y \
    git \
    curl \
    zsh \
    unzip \
    wget \
    procps \
 && rm -rf /var/lib/apt/lists/*