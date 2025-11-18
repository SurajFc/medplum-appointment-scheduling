# Contributing to Altura EHR Demo

Thank you for your interest in contributing to the Altura EHR Demo project!

## 🚨 Important Notice

This is a **demonstration application** only. Please ensure any contributions maintain the educational/demo nature of this project and never include real PHI (Protected Health Information).

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/ymykhal/altura-medplum-demo.git
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development**:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Standards
- **TypeScript**: Strict typing, no `any` types
- **ESLint**: Follow the existing ESLint configuration
- **Components**: Use functional components with hooks
- **Styling**: Tailwind CSS with responsive design principles

### FHIR Compliance
- Use proper FHIR R4 resource structures
- Leverage Medplum SDK for FHIR operations
- Maintain healthcare data standards

### Testing
- Test all new features locally
- Ensure mobile responsiveness
- Verify FHIR resource handling

## Contribution Types

### Welcome Contributions
- 🐛 Bug fixes
- ✨ New demo features
- 📱 UI/UX improvements
- 📚 Documentation updates
- 🔧 Performance optimizations

### Not Suitable
- ❌ Real PHI data
- ❌ Production security features
- ❌ HIPAA compliance implementations
- ❌ Breaking changes to demo data structure

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, documented code
   - Follow existing patterns
   - Test thoroughly

3. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add appointment filtering feature"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Submit Pull Request**:
   - Clear description of changes
   - Screenshots for UI changes
   - Reference any related issues

## Code Review

All submissions require review. We'll look for:
- Code quality and consistency
- Proper TypeScript usage
- Mobile responsiveness
- FHIR compliance
- Documentation updates

## Questions?

- 📖 Check the [README](README.md) first
- 🔍 Search existing [issues](https://github.com/ymykhal/altura-medplum-demo/issues)
- 💬 Create a new issue for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Remember**: This is a demo application for educational purposes. Never use real patient data!