import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html'
})
export class OtpComponent {

  email = '';
  otp = '';
  message = '';

  constructor(private http: HttpClient) {}

  sendOtp() {
    this.http.post('/.netlify/functions/otp', {
      action: 'send',
      email: this.email
    }).subscribe((res: any) => {
      this.message = res.message;
    }, err => {
      this.message = err.error.message;
    });
  }

  verifyOtp() {
    this.http.post('/.netlify/functions/otp', {
      action: 'verify',
      email: this.email,
      otp: this.otp
    }).subscribe((res: any) => {
      this.message = res.message;
    }, err => {
      this.message = err.error.message;
    });
  }
}