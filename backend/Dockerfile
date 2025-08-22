FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# build `joyce` binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o joyce ./cmd/server/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/joyce .

RUN mkdir -p ./uploads

EXPOSE 8080
CMD ["./joyce"]