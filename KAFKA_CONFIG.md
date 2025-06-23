# Kafka Integration Configuration (node-rdkafka Compatible)

This document describes how to configure Kafka integration for the Research Interview Management System using node-rdkafka compatible configuration parameters.

## Feature Toggle

The Kafka integration can be enabled or disabled using:
```bash
KAFKA_ENABLED=true  # Set to 'true' to enable, any other value disables
```

## Basic Configuration

### Broker List
```bash
# Primary configuration (node-rdkafka standard)
KAFKA_METADATA_BROKER_LIST=localhost:9092

# Alternative (for compatibility)
KAFKA_BROKERS=localhost:9092
```

### Multiple Brokers (Cluster)
```bash
KAFKA_METADATA_BROKER_LIST=broker1:9092,broker2:9092,broker3:9092
```

### Client Configuration
```bash
KAFKA_CLIENT_ID=research-management-system  # Optional, defaults to 'research-management-system'
```

## Security Configuration (node-rdkafka style)

### Security Protocol
```bash
SECURITY_PROTOCOL=PLAINTEXT      # PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
```

### SSL/TLS Configuration

For SSL or SASL_SSL protocols:
```bash
SECURITY_PROTOCOL=SSL  # or SASL_SSL

# SSL Certificate locations (node-rdkafka standard)
SSL_CA_LOCATION=/path/to/ca-cert.pem          # Certificate Authority certificate
SSL_CERTIFICATE_LOCATION=/path/to/client-cert.pem    # Client certificate  
SSL_KEY_LOCATION=/path/to/client-key.pem      # Client private key
SSL_KEY_PASSWORD=your-key-password            # Private key password (if encrypted)
SSL_ENDPOINT_IDENTIFICATION_ALGORITHM=https   # Hostname verification (default: https)
```

### SASL Authentication

For SASL_PLAINTEXT or SASL_SSL protocols:

#### SASL/PLAIN
```bash
SECURITY_PROTOCOL=SASL_SSL  # or SASL_PLAINTEXT
SASL_MECHANISM=PLAIN
SASL_USERNAME=your-username
SASL_PASSWORD=your-password
```

#### SASL/SCRAM-SHA-256
```bash
SECURITY_PROTOCOL=SASL_SSL
SASL_MECHANISM=SCRAM-SHA-256
SASL_USERNAME=your-username
SASL_PASSWORD=your-password
```

#### SASL/SCRAM-SHA-512
```bash
SECURITY_PROTOCOL=SASL_SSL
SASL_MECHANISM=SCRAM-SHA-512
SASL_USERNAME=your-username
SASL_PASSWORD=your-password
```

#### SASL/GSSAPI (Kerberos)
```bash
SECURITY_PROTOCOL=SASL_SSL
SASL_MECHANISM=GSSAPI
SASL_KERBEROS_PRINCIPAL=your-principal@YOUR-REALM.COM
SASL_KERBEROS_SERVICE_NAME=kafka                          # Optional, defaults to 'kafka'
SASL_KERBEROS_KEYTAB=/path/to/your.keytab                # Optional keytab file
SASL_KERBEROS_KINIT_CMD=kinit -kt %{keytab} %{principal} # Optional custom kinit command
```

## Example Configurations

### Local Development
```bash
KAFKA_ENABLED=true
KAFKA_METADATA_BROKER_LIST=localhost:9092
SECURITY_PROTOCOL=PLAINTEXT
```

### Production with SSL + SASL
```bash
# Enable Kafka
KAFKA_ENABLED=true

# Broker configuration
KAFKA_METADATA_BROKER_LIST=secure-broker1:9093,secure-broker2:9093

# Security Protocol
SECURITY_PROTOCOL=SASL_SSL

# SSL Configuration
SSL_CA_LOCATION=/opt/kafka/ssl/ca-cert.pem
SSL_CERTIFICATE_LOCATION=/opt/kafka/ssl/client-cert.pem
SSL_KEY_LOCATION=/opt/kafka/ssl/client-key.pem
SSL_ENDPOINT_IDENTIFICATION_ALGORITHM=https

# SASL Configuration
SASL_MECHANISM=SCRAM-SHA-256
SASL_USERNAME=research-app
SASL_PASSWORD=secure-password-here
```

### Confluent Cloud Example
```bash
KAFKA_ENABLED=true
KAFKA_METADATA_BROKER_LIST=your-cluster.confluent.cloud:9092
SECURITY_PROTOCOL=SASL_SSL
SASL_MECHANISM=PLAIN
SASL_USERNAME=your-api-key
SASL_PASSWORD=your-api-secret
```

### Kerberos Authentication Example
```bash
KAFKA_ENABLED=true
KAFKA_METADATA_BROKER_LIST=kerberized-broker1:9092,kerberized-broker2:9092
SECURITY_PROTOCOL=SASL_SSL
SASL_MECHANISM=GSSAPI
SASL_KERBEROS_PRINCIPAL=kafka-client@EXAMPLE.COM
SASL_KERBEROS_SERVICE_NAME=kafka
SASL_KERBEROS_KEYTAB=/etc/security/keytabs/kafka-client.keytab
```

## Topics

The application publishes to these topics:
- `completed-meetings` - Published when a meeting is marked as completed
- `completed-researches` - Published when a research project is marked as completed

## Message Format

### Completed Meeting Message
```json
{
  "id": 123,
  "type": "meeting",
  "status": "Done",
  "action": "completed",
  "data": {
    "respondentName": "John Doe",
    "respondentPosition": "Senior Developer",
    "companyName": "Tech Corp",
    "researcher": "Jane Smith",
    "date": "2025-06-16T10:00:00Z",
    "researchId": 456,
    "cnum": "C12345"
  },
  "timestamp": "2025-06-16T10:30:00Z"
}
```

### Completed Research Message
```json
{
  "id": 456,
  "type": "research",
  "status": "Done",
  "action": "completed",
  "data": {
    "name": "User Experience Research",
    "team": "UX Team",
    "researcher": "Jane Smith",
    "description": "Research on user preferences",
    "dateStart": "2025-06-01",
    "dateEnd": "2025-06-30",
    "researchType": "User Research",
    "products": "Product A"
  },
  "timestamp": "2025-06-16T10:30:00Z"
}
```

## Message Headers

All messages include these headers:
- `event-type`: Either "meeting-completed" or "research-completed"
- `source`: "research-management-system"

## Configuration Migration from kafkajs

If migrating from a kafkajs configuration, use this mapping:

| kafkajs Config | node-rdkafka Equivalent |
|----------------|-------------------------|
| `KAFKA_BROKERS` | `KAFKA_METADATA_BROKER_LIST` |
| `KAFKA_SSL_ENABLED=true` | `SECURITY_PROTOCOL=SSL` |
| `KAFKA_SASL_MECHANISM=PLAIN` + `KAFKA_SSL_ENABLED=true` | `SECURITY_PROTOCOL=SASL_SSL` + `SASL_MECHANISM=PLAIN` |
| `KAFKA_SSL_CA` | `SSL_CA_LOCATION` |
| `KAFKA_SSL_CERT` | `SSL_CERTIFICATE_LOCATION` |
| `KAFKA_SSL_KEY` | `SSL_KEY_LOCATION` |
| `KAFKA_SASL_USERNAME` | `SASL_USERNAME` |
| `KAFKA_SASL_PASSWORD` | `SASL_PASSWORD` |

## Troubleshooting

1. **Connection Issues**: Verify `KAFKA_METADATA_BROKER_LIST` and network connectivity
2. **Security Protocol Mismatch**: Ensure `SECURITY_PROTOCOL` matches your Kafka cluster configuration
3. **Authentication Failures**: Check SASL credentials and mechanism
4. **SSL Errors**: Verify certificate file paths in `SSL_*_LOCATION` variables
5. **Kerberos Issues**: Ensure keytab file exists and principal is correct

## Status Monitoring

The application provides logging for:
- Connection status with security protocol information
- Authentication method being used
- SSL/TLS encryption status
- Any configuration or connection errors