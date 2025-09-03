# Row Level Security (RLS) Policies Documentation

This document provides a comprehensive overview of all Row Level Security (RLS) policies implemented in the database to ensure proper data isolation and access control.

## Overview

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access in a table. Each RLS policy defines a condition that must be true for a user to access a row. Our implementation ensures:

- **Data Isolation**: Users can only access their own data
- **Feature Gating**: Access to features is controlled by subscription tiers
- **Audit Trail**: Critical operations are logged and protected from modification
- **Admin Access**: Service role has full access for administrative operations

## Policy Categories

### 1. User Data Isolation

Policies that ensure users can only access their own data.

### 2. Public Content Access

Policies that allow authenticated users to view public content.

### 3. Feature-Based Access

Policies that control access based on user entitlements and subscription status.

### 4. Audit Trail Protection

Policies that prevent modification of critical audit records.

### 5. Administrative Access

Policies that grant full access to service role for administrative operations.

## Table-Specific Policies

### Profiles Table

**Purpose**: User profile information and subscription data

**Policies**:

- `Users can view their own profile`: Users can only view their own profile
- `Users can update their own profile`: Users can only update their own profile
- `Users can insert their own profile`: Users can only create their own profile
- `Service role can manage all profiles`: Service role has full access

**Security Level**: High - Contains sensitive user information

### Prompt Templates Table

**Purpose**: User-created prompt templates

**Policies**:

- `Users can view their own templates`: Users can view their own templates
- `Users can view public templates`: All users can view public templates
- `Users can view featured templates`: All users can view featured templates
- `Users can create their own templates`: Users can create templates
- `Users can update their own templates`: Users can update their own templates
- `Users can delete their own templates`: Users can delete their own templates
- `Service role can manage all templates`: Service role has full access

**Security Level**: Medium - Public templates are visible to all users

### AI Usage Logs Table

**Purpose**: Audit trail of AI API usage

**Policies**:

- `Users can view their own usage logs`: Users can view their own usage
- `Users can insert their own usage logs`: Users can log their own usage
- `Users cannot modify usage logs`: Users cannot update usage logs (audit trail)
- `Users cannot delete usage logs`: Users cannot delete usage logs (audit trail)
- `Service role can manage all usage logs`: Service role has full access

**Security Level**: High - Critical audit trail, protected from modification

### User Quotas Table

**Purpose**: User quota management and limits

**Policies**:

- `Users can view their own quotas`: Users can view their own quotas
- `Users can update their own quotas`: Users can update their own quotas
- `Users can insert their own quotas`: Users can create their own quotas
- `Users cannot delete quota records`: Users cannot delete quota records
- `Service role can manage all quotas`: Service role has full access

**Security Level**: Medium - Users can view and update their own quotas

### AI Provider Configs Table

**Purpose**: AI provider configuration and costs

**Policies**:

- `Authenticated users can view active provider configs`: All authenticated users can view active configs
- `Service role can manage all provider configs`: Only service role can manage configs

**Security Level**: Low - Public configuration data, but only service role can modify

### Subscriptions Table

**Purpose**: User subscription information

**Policies**:

- `Users can view their own subscriptions`: Users can view their own subscriptions
- `Users can insert their own subscriptions`: Users can create their own subscriptions
- `Users can update their own subscriptions`: Users can update their own subscriptions
- `Users cannot delete subscription records`: Users cannot delete subscription records
- `Service role can manage all subscriptions`: Service role has full access

**Security Level**: High - Contains billing and subscription information

### Subscription Plans Table

**Purpose**: Available subscription plans

**Policies**:

- `Authenticated users can view active subscription plans`: All authenticated users can view active plans
- `Service role can manage all subscription plans`: Only service role can manage plans

**Security Level**: Low - Public plan information, but only service role can modify

### Feature Entitlements Table

**Purpose**: User feature access and usage limits

**Policies**:

- `Users can view their own entitlements`: Users can view their own entitlements
- `Users can insert their own entitlements`: Users can create their own entitlements
- `Users can update their own entitlements`: Users can update their own entitlements
- `Users cannot delete entitlement records`: Users cannot delete entitlement records
- `Service role can manage all entitlements`: Service role has full access

**Security Level**: Medium - Users can manage their own entitlements

### Billing Events Table

**Purpose**: Audit trail of billing events

**Policies**:

- `Users can view their own billing events`: Users can view their own billing events
- `Users can insert their own billing events`: Users can create billing events
- `Users cannot modify billing events`: Users cannot update billing events (audit trail)
- `Users cannot delete billing events`: Users cannot delete billing events (audit trail)
- `Service role can manage all billing events`: Service role has full access

**Security Level**: High - Critical billing audit trail, protected from modification

### Community Tables

#### Community Prompts Table

**Purpose**: Shared community content

**Policies**:

- `Users can view approved community prompts`: Users can view approved prompts
- `Users can view featured community prompts`: Users can view featured prompts
- `Users can create their own community prompts`: Users can create prompts
- `Users can update their own community prompts`: Users can update their own prompts
- `Users can delete their own community prompts`: Users can delete their own prompts
- `Service role can manage all community content`: Service role has full access

**Security Level**: Medium - Public content with user ownership

#### Community Saves Table

**Purpose**: User bookmarks of community content

**Policies**:

- `Users can view their own saves`: Users can view their own saves
- `Users can create their own saves`: Users can create saves
- `Users can delete their own saves`: Users can delete their own saves
- `Service role can manage all community saves`: Service role has full access

**Security Level**: Medium - Users can manage their own saves

#### Community Ratings Table

**Purpose**: User ratings and reviews

**Policies**:

- `Users can view all ratings for approved prompts`: Users can view ratings for approved prompts
- `Users can create their own ratings`: Users can create ratings
- `Users can update their own ratings`: Users can update their own ratings
- `Users can delete their own ratings`: Users can delete their own ratings
- `Service role can manage all community ratings`: Service role has full access

**Security Level**: Medium - Public ratings with user ownership

#### Community Comments Table

**Purpose**: User comments on community content

**Policies**:

- `Users can view all comments for approved prompts`: Users can view comments for approved prompts
- `Users can create their own comments`: Users can create comments
- `Users can update their own comments`: Users can update their own comments
- `Users can delete their own comments`: Users can delete their own comments
- `Service role can manage all community comments`: Service role has full access

**Security Level**: Medium - Public comments with user ownership

#### Community Follows Table

**Purpose**: User relationships and follows

**Policies**:

- `Users can view their own follows`: Users can view their own follows
- `Users can create their own follows`: Users can create follows
- `Users can delete their own follows`: Users can delete their own follows
- `Service role can manage all community follows`: Service role has full access

**Security Level**: Medium - Users can manage their own follows

#### Community Notifications Table

**Purpose**: User notifications

**Policies**:

- `Users can view their own notifications`: Users can view their own notifications
- `Users can create their own notifications`: Users can create notifications
- `Users can update their own notifications`: Users can update their own notifications
- `Service role can manage all community notifications`: Service role has full access

**Security Level**: Medium - Users can manage their own notifications

## Security Functions

### Permission Checking Functions

#### `can_publish_to_community(user_uuid UUID)`

**Purpose**: Check if user has permission to publish to community
**Returns**: Boolean indicating if user can publish
**Usage**: Used to gate community publishing features

#### `can_access_premium_features(user_uuid UUID)`

**Purpose**: Check if user has access to premium features
**Returns**: Boolean indicating if user has active subscription
**Usage**: Used to gate premium features

#### `get_user_subscription_tier(user_uuid UUID)`

**Purpose**: Get user's subscription tier
**Returns**: Subscription tier ('free', 'pro', etc.)
**Usage**: Used for feature gating and UI display

#### `is_admin(user_uuid UUID)`

**Purpose**: Check if user is admin (placeholder for future admin features)
**Returns**: Boolean indicating admin status
**Usage**: Future admin feature gating

### Audit and Rate Limiting Functions

#### `log_security_event(user_uuid, event_type, table_name, record_id, details)`

**Purpose**: Log security events for audit purposes
**Returns**: Void
**Usage**: Placeholder for future audit logging

#### `check_rate_limit(user_uuid, operation_type, time_window_minutes)`

**Purpose**: Check if user is within rate limits
**Returns**: Boolean indicating if operation is allowed
**Usage**: Rate limiting for API operations

## Security Best Practices

### 1. Principle of Least Privilege

- Users only have access to data they need
- Service role has full access for administrative operations
- Public data is accessible to all authenticated users

### 2. Audit Trail Protection

- Critical tables (usage logs, billing events) are protected from user modification
- Users can view but not modify audit records
- Service role can manage all audit records

### 3. Feature Gating

- Access to features is controlled by subscription tiers
- Community publishing requires specific entitlements
- Premium features require active subscriptions

### 4. Data Isolation

- Users can only access their own data
- Cross-user data access is explicitly controlled
- Public content is clearly separated from private content

### 5. Administrative Access

- Service role has full access to all tables
- Admin functions are available for future administrative features
- Audit logging is available for security monitoring

## Testing RLS Policies

### Manual Testing

```sql
-- Test user can only see their own profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Test user cannot see other users' profiles
SELECT * FROM profiles WHERE id != auth.uid();

-- Test user can only see their own templates
SELECT * FROM prompt_templates WHERE user_id = auth.uid();

-- Test user can see public templates
SELECT * FROM prompt_templates WHERE is_public = true;
```

### Automated Testing

Create test cases that verify:

- Users can access their own data
- Users cannot access other users' data
- Public content is accessible to all authenticated users
- Feature gating works correctly
- Audit trails are protected from modification

## Migration and Deployment

### Applying RLS Policies

1. Run the migration file: `006_enhanced_rls_policies.sql`
2. Verify all policies are created correctly
3. Test with sample data
4. Monitor for any access issues

### Rollback Plan

If issues arise:

1. Disable RLS on specific tables: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
2. Drop specific policies: `DROP POLICY policy_name ON table_name;`
3. Re-enable RLS after fixing issues

## Monitoring and Maintenance

### Policy Monitoring

- Monitor for policy violations in logs
- Track access patterns for security analysis
- Review policy effectiveness regularly

### Policy Updates

- Update policies when new features are added
- Review and enhance policies based on security requirements
- Add new policies for new tables or features

### Performance Considerations

- RLS policies add overhead to queries
- Monitor query performance with RLS enabled
- Optimize policies for frequently accessed data

## Future Enhancements

### Planned Improvements

1. **Admin Role System**: Implement proper admin role checking
2. **Audit Logging**: Create comprehensive audit trail system
3. **Advanced Rate Limiting**: Implement more sophisticated rate limiting
4. **Data Encryption**: Add encryption for sensitive data
5. **Compliance Features**: Add GDPR and other compliance features

### Security Enhancements

1. **IP-based Restrictions**: Add IP-based access controls
2. **Time-based Access**: Implement time-based access restrictions
3. **Geographic Restrictions**: Add geographic access controls
4. **Multi-factor Authentication**: Integrate with MFA systems

## Conclusion

This RLS implementation provides a robust security foundation for the application. The policies ensure data isolation, protect audit trails, and enable feature gating while maintaining flexibility for future enhancements. Regular monitoring and updates will ensure the security system remains effective as the application evolves.
