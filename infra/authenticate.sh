aws cognito-idp admin-initiate-auth \
  --user-pool-id <USER_POOL_ID> \
  --region us-east-1 \
  --client-id 4b795gduqrkbgceqdaimrcck0i \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@example.com,PASSWORD=YourNewSecurePass123!
