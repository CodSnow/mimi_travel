FROM python:3.12-slim

RUN set -eux; \
    echo 'deb http://mirrors.ustc.edu.cn/debian stable main contrib non-free' > /etc/apt/sources.list && \
    echo 'deb http://mirrors.ustc.edu.cn/debian stable-updates main contrib non-free' >> /etc/apt/sources.list && \
    rm -rf /etc/apt/sources.list.d/* && \
    apt-get update

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/python-service

WORKDIR /app/python-service

COPY python-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

COPY python-service/ ./
COPY deploy/python-entrypoint.sh /app/python-service/docker-entrypoint.sh

RUN chmod +x /app/python-service/docker-entrypoint.sh

EXPOSE 8000

CMD ["/app/python-service/docker-entrypoint.sh"]
