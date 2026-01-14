#!/usr/bin/env python3
"""
Brute Force Security Test Suite
================================
This script tests the security of the authentication endpoint against brute force attacks.
Only use this on systems you have permission to test.

Usage:
    python brute_force.py --email <target_email> [--url <api_url>] [--wordlist <path>]

Example:
    python brute_force.py --email admin@example.com
    python brute_force.py --email user@test.com --url http://localhost:3000/api/auth
"""

import requests
import argparse
import time
import sys
from pathlib import Path
from colorama import Fore, Style, init
from typing import Optional, Tuple
import json

init(autoreset=True)


class BruteForceTest:
    """Class to handle brute force testing of authentication endpoints."""

    def __init__(self, url: str, email: str, wordlist_path: str):
        """
        Initialize the brute force tester.

        Args:
            url: Target authentication endpoint URL
            email: Email address to test
            wordlist_path: Path to password wordlist file
        """
        self.url = url
        self.email = email
        self.wordlist_path = Path(wordlist_path)
        self.attempts = 0
        self.start_time = None
        self.successful_password = None

    def print_banner(self):
        """Display test information banner."""
        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}  BRUTE FORCE SECURITY TEST")
        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Target URL:{Style.RESET_ALL}    {self.url}")
        print(f"{Fore.YELLOW}Target Email:{Style.RESET_ALL}  {self.email}")
        print(f"{Fore.YELLOW}Wordlist:{Style.RESET_ALL}      {self.wordlist_path}")
        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")
        print(f"{Fore.RED}⚠️  WARNING: Only use this tool on systems you have permission to test!")
        print(f"{Fore.RED}⚠️  Unauthorized access attempts are illegal!{Style.RESET_ALL}\n")

    def load_wordlist(self) -> list:
        """
        Load passwords from wordlist file.

        Returns:
            List of passwords from the wordlist
        """
        try:
            with open(self.wordlist_path, 'r', encoding='utf-8') as f:
                passwords = [line.strip() for line in f if line.strip()]
            print(f"{Fore.GREEN}✓{Style.RESET_ALL} Loaded {len(passwords)} passwords from wordlist\n")
            return passwords
        except FileNotFoundError:
            print(f"{Fore.RED}✗ Error: Wordlist file not found at {self.wordlist_path}{Style.RESET_ALL}")
            sys.exit(1)
        except Exception as e:
            print(f"{Fore.RED}✗ Error loading wordlist: {str(e)}{Style.RESET_ALL}")
            sys.exit(1)

    def attempt_login(self, password: str) -> Tuple[bool, Optional[dict]]:
        """
        Attempt to login with given password.

        Args:
            password: Password to test

        Returns:
            Tuple of (success, response_data)
        """
        self.attempts += 1

        payload = {
            "email": self.email,
            "password": password
        }

        headers = {
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(
                self.url,
                json=payload,
                headers=headers,
                timeout=10
            )

            if response.status_code == 429:
                print(f"\n{Fore.GREEN}🛡️  Security Mechanism Triggered: Rate Limit Exceeded (429){Style.RESET_ALL}")
                print(f"{Fore.GREEN}✓ The application successfully detected and blocked the brute force attack.{Style.RESET_ALL}")
                sys.exit(0)

            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'token' in data:
                        return True, data
                except json.JSONDecodeError:
                    pass

            return False, None

        except requests.exceptions.ConnectionError:
            print(f"\n{Fore.RED}✗ Connection Error: Cannot connect to {self.url}")
            print(f"{Fore.YELLOW}  Make sure the server is running!{Style.RESET_ALL}\n")
            sys.exit(1)
        except requests.exceptions.Timeout:
            print(f"\n{Fore.YELLOW}⚠ Request timeout for password: {password}{Style.RESET_ALL}")
            return False, None
        except Exception as e:
            print(f"\n{Fore.RED}✗ Unexpected error: {str(e)}{Style.RESET_ALL}")
            return False, None

    def run_test(self, delay: float = 0.1):
        """
        Run the brute force test.

        Args:
            delay: Delay in seconds between attempts
        """
        self.print_banner()

        confirm = input(f"{Fore.YELLOW}Do you have permission to test this system? (yes/no): {Style.RESET_ALL}")
        if confirm.lower() != 'yes':
            print(f"{Fore.RED}Test aborted.{Style.RESET_ALL}")
            sys.exit(0)

        passwords = self.load_wordlist()
        total_passwords = len(passwords)

        print(f"{Fore.CYAN}Starting brute force test...{Style.RESET_ALL}\n")
        self.start_time = time.time()

        for index, password in enumerate(passwords, 1):
            progress = (index / total_passwords) * 100
            print(f"{Fore.CYAN}[{index}/{total_passwords}] ({progress:.1f}%){Style.RESET_ALL} Testing: {password:<20}", end='\r')

            success, response_data = self.attempt_login(password)

            if success:
                self.successful_password = password
                print(f"\n\n{Fore.GREEN}{'='*70}")
                print(f"  ✓ SUCCESS! Password found!")
                print(f"{'='*70}{Style.RESET_ALL}")
                print(f"{Fore.GREEN}Email:{Style.RESET_ALL}     {self.email}")
                print(f"{Fore.GREEN}Password:{Style.RESET_ALL}  {password}")
                print(f"{Fore.GREEN}Token:{Style.RESET_ALL}     {response_data.get('token', 'N/A')[:50]}...")
                print(f"{Fore.GREEN}{'='*70}{Style.RESET_ALL}\n")
                break

            time.sleep(delay)

        self.print_summary()

    def print_summary(self):
        """Print test summary statistics."""
        elapsed_time = time.time() - self.start_time if self.start_time else 0

        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"  TEST SUMMARY")
        print(f"{'='*70}{Style.RESET_ALL}")
        print(f"Total attempts:    {self.attempts}")
        print(f"Time elapsed:      {elapsed_time:.2f} seconds")
        print(f"Attempts per sec:  {self.attempts / elapsed_time if elapsed_time > 0 else 0:.2f}")

        if self.successful_password:
            print(f"{Fore.GREEN}Result:{Style.RESET_ALL}            ✓ Password found: {self.successful_password}")
            print(f"\n{Fore.RED}SECURITY RECOMMENDATION:{Style.RESET_ALL}")
            print(f"  • The password '{self.successful_password}' is too weak and easily guessable")
            print(f"  • Implement rate limiting on the authentication endpoint")
            print(f"  • Consider adding CAPTCHA after multiple failed attempts")
            print(f"  • Enforce strong password policies")
        else:
            print(f"{Fore.YELLOW}Result:{Style.RESET_ALL}            ✗ Password not found in wordlist")
            print(f"\n{Fore.GREEN}SECURITY STATUS:{Style.RESET_ALL}")
            print(f"  • Password resisted common password dictionary attack")
            print(f"  • Continue to monitor for rate limiting effectiveness")

        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description='Brute Force Security Testing Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python brute_force.py --email admin@example.com
  python brute_force.py --email user@test.com --url http://localhost:3000/api/auth
  python brute_force.py --email test@test.com --wordlist custom_wordlist.txt --delay 0.5
        """
    )

    parser.add_argument(
        '--email',
        type=str,
        required=True,
        help='Target email address to test'
    )

    parser.add_argument(
        '--url',
        type=str,
        default='http://localhost:3000/api/auth',
        help='Authentication endpoint URL (default: http://localhost:3000/api/auth)'
    )

    parser.add_argument(
        '--wordlist',
        type=str,
        default='wordlist.txt',
        help='Path to password wordlist file (default: wordlist.txt)'
    )

    parser.add_argument(
        '--delay',
        type=float,
        default=0.1,
        help='Delay between attempts in seconds (default: 0.1)'
    )

    args = parser.parse_args()

    tester = BruteForceTest(args.url, args.email, args.wordlist)
    tester.run_test(delay=args.delay)


if __name__ == '__main__':
    main()
