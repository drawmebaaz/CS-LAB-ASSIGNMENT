// Small cross-platform helper used by the protected demo.
// It writes one argument literally, without asking a shell to interpret it.
process.stdout.write(String(process.argv[2] ?? ''));
