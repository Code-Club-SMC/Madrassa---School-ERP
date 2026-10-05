# syntax=docker/dockerfile:1

FROM postgres:18.3-alpine3.23

LABEL org.opencontainers.image.title="msmis-postgres" \
      org.opencontainers.image.description="Postgres 18.3 with tuning, pg_stat_statements and pg_trgm for the School ERP"

COPY conf/ /etc/postgresql/conf.d/
COPY initdb/ /docker-entrypoint-initdb.d/
COPY entrypoint.sh /usr/local/bin/docker-entrypoint-msmis.sh

RUN chmod +x /usr/local/bin/docker-entrypoint-msmis.sh

EXPOSE 5432

ENTRYPOINT ["docker-entrypoint-msmis.sh"]
CMD ["postgres"]