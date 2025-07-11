# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Install air for hot-reloading
RUN go install github.com/air-verse/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o indexer ./cmd/indexer

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/indexer .

# Copy air from builder
COPY --from=builder /go/bin/air /usr/local/bin/air

# Expose ports
EXPOSE 8081 50051

CMD ["./indexer"]