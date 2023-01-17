# Development

## Prerequisites

- [Install Pulumi](https://www.pulumi.com/docs/get-started/aws/begin/)
- AWS Access ideally via [saml2aws](https://github.com/Versent/saml2aws) alternative [aws-vault](https://github.com/99designs/aws-vault)
- Install pre-commit `pre-commit install`

## Developing

Double check you're using the right user account and the correct AWS account
```
aws sts get-caller-identity
```
