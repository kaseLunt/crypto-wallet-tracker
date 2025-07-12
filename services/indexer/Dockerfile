# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies (Fixed: Added build-base for musl/GCC, needed for some deps even with CGO=0)
RUN apk add --no-cache git build-base

# Install air for hot-reloading
RUN go install github.com/air-verse/air@latest

# Copy go mod files
COPY go.mod go.sum ./

# Download and tidy modules (Fixed: Ensures all deps like gogecko are resolved)
RUN go mod download && go mod tidy

# Copy source code
COPY . .

# Build the binary (Fixed: CGO=0 to avoid dynamic linking issues)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o indexer ./cmd/indexer

# Final stage (Fixed: Use golang base for Air to run "go build" during hot-reload)
FROM golang:1.24-alpine

RUN apk --no-cache add ca-certificates build-base git  # Fixed: Add build deps for Air's runtime builds

WORKDIR /app

# Copy the pre-built binary from builder
COPY --from=builder /app/indexer .

# Copy air from builder
COPY --from=builder /go/bin/air /usr/local/bin/air

# Fixed: Copy source code and .air.toml for Air hot-reloading
COPY --from=builder /app /app

# Expose ports
EXPOSE 8081 50051

CMD ["air", "-c", ".air.toml"]