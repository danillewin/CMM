# Kafka Configuration Guide

This document explains how to configure Kafka integration with SASL_SSL and Kerberos authentication for the Research Management System.

## Environment Variables

### Basic Configuration
```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092
KAFKA_CLIENT_ID=research-management-system
```

**Note**: You can use either `KAFKA_BROKERS` for multiple brokers or `KAFKA_BROKER` for a single broker. The system supports both formats for backward compatibility.

#### Broker Configuration Options:
- **Single Broker**: `KAFKA_BROKER=localhost:9092`
- **Multiple Brokers**: `KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092`
- **Mixed Ports**: `KAFKA_BROKERS=kafka1.example.com:9092,kafka2.example.com:9093,kafka3.example.com:9094`

### SSL/TLS Configuration
```bash
KAFKA_SSL_ENABLED=true
KAFKA_SSL_REJECT_UNAUTHORIZED=true
KAFKA_SSL_CA=/path/to/ca-cert.pem
KAFKA_SSL_CERT=/path/to/client-cert.pem
KAFKA_SSL_KEY=/path/to/client-key.pem
```

### SASL Authentication Mechanisms

#### 1. Kerberos (GSSAPI) - Recommended for Enterprise
```bash
KAFKA_SASL_MECHANISM=GSSAPI
KAFKA_SASL_KERBEROS_SERVICE_NAME=kafka
KAFKA_SASL_KERBEROS_PRINCIPAL=your-service@YOUR.REALM
KAFKA_SASL_KERBEROS_KEYTAB=/path/to/service.keytab
KAFKA_SASL_KERBEROS_KINIT_CMD=/usr/bin/kinit
```

#### 2. SCRAM-SHA-256 (Username/Password)
```bash
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
```

#### 3. SCRAM-SHA-512 (Username/Password)
```bash
KAFKA_SASL_MECHANISM=SCRAM-SHA-512
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
```

#### 4. PLAIN (Username/Password)
```bash
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
```

## Configuration Examples

### Production Environment with Kerberos
```bash
# Enable Kafka integration
KAFKA_ENABLED=true

# Kafka cluster configuration
KAFKA_BROKERS=kafka1.company.com:9093,kafka2.company.com:9093,kafka3.company.com:9093
KAFKA_CLIENT_ID=research-management-prod

# SSL/TLS configuration
KAFKA_SSL_ENABLED=true
KAFKA_SSL_REJECT_UNAUTHORIZED=true
KAFKA_SSL_CA=/etc/ssl/certs/kafka-ca.pem

# Kerberos authentication
KAFKA_SASL_MECHANISM=GSSAPI
KAFKA_SASL_KERBEROS_SERVICE_NAME=kafka
KAFKA_SASL_KERBEROS_PRINCIPAL=research-service@COMPANY.COM
KAFKA_SASL_KERBEROS_KEYTAB=/etc/keytabs/research-service.keytab
```

### Development Environment with SCRAM
```bash
# Enable Kafka integration
KAFKA_ENABLED=true

# Kafka cluster configuration
KAFKA_BROKERS=dev-kafka1.company.com:9093,dev-kafka2.company.com:9093
KAFKA_CLIENT_ID=research-management-dev

# SSL/TLS configuration
KAFKA_SSL_ENABLED=true
KAFKA_SSL_REJECT_UNAUTHORIZED=false

# SCRAM authentication
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
KAFKA_SASL_USERNAME=research-dev-user
KAFKA_SASL_PASSWORD=dev-password-123
```

## Topics

The system automatically publishes to these topics when entities reach "Done" status:

- **completed-meetings**: Meeting completion events
- **completed-researches**: Research completion events

## Message Format

### Meeting Completion Message
```json
{
  "id": 123,
  "type": "meeting",
  "status": "Done",
  "action": "completed",
  "data": {
    "respondentName": "John Doe",
    "respondentPosition": "CEO",
    "companyName": "Example Corp",
    "researcher": "Jane Smith",
    "date": "2025-01-15T10:00:00Z",
    "researchId": 456,
    "cnum": "C12345"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Research Completion Message
```json
{
  "id": 456,
  "type": "research",
  "status": "Done",
  "action": "completed",
  "data": {
    "name": "Customer Journey Analysis",
    "team": "Product Strategy",
    "researcher": "Jane Smith",
    "description": "Research description...",
    "dateStart": "2025-01-01T00:00:00Z",
    "dateEnd": "2025-01-31T00:00:00Z",
    "researchType": "Interviews",
    "products": ["Product A", "Product B"]
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Security Best Practices

1. **Use Kerberos for Production**: GSSAPI provides the strongest authentication mechanism
2. **Enable SSL/TLS**: Always encrypt data in transit
3. **Secure Keytab Files**: Protect keytab files with appropriate file permissions (600)
4. **Rotate Credentials**: Regularly rotate passwords and renew Kerberos tickets
5. **Network Security**: Use VPNs or private networks for Kafka communication
6. **Monitor Access**: Enable Kafka audit logging to track access patterns

## Troubleshooting

### Common Issues

1. **Kerberos Authentication Fails**
   - Verify principal name format
   - Check keytab file permissions and location
   - Ensure system time is synchronized with KDC
   - Verify DNS resolution for Kerberos realm

2. **SSL Connection Issues**
   - Verify certificate paths and permissions
   - Check certificate validity and chain
   - Ensure hostname matches certificate

3. **SASL Authentication Fails**
   - Verify username/password credentials
   - Check SASL mechanism support on broker
   - Ensure proper ACLs are configured

### Debug Logging

Enable detailed logging by setting environment variables:
```bash
DEBUG=kafkajs*
```

This will provide detailed connection and authentication information in the application logs.