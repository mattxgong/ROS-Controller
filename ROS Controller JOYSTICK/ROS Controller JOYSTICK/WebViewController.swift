//
//  WebViewController.swift
//  ROS Controller
//
//  Created by Grace Chen on 2022-10-05.
//

import UIKit
import WebKit
import BRHJoyStickView

class WebViewController: ViewController, WKUIDelegate, WKNavigationDelegate {
    
    @IBOutlet var WebServer: WKWebView!
    var joystickOffset: CGFloat = 60.0
    var joystickSpan: CGFloat = 100.0
    var joyStick: JoyStickView!
    var theta: String = ""
    var magnitude: String = ""
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // let HTMLFile = Bundle.main.url(forResource: "index", withExtension: "html")!
        // let HTML = try? String(contentsOf: HTMLFile, encoding: String.Encoding.utf8)
        // WebServer.loadHTMLString(HTML!, baseURL: HTMLFile)
        
        if let path = Bundle.main.url(forResource: "index", withExtension: "html"){
            let request: URLRequest = URLRequest(url: path)
            WebServer.load(request)
        }
        
        WebServer.navigationDelegate = self
        WebServer.uiDelegate = self
        
        let scriptFile = Bundle.main.path(forResource: "main", ofType: "js")
        let script = try? String(contentsOfFile: scriptFile!)
        let mainJS = WKUserScript(source: script!, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        
        self.WebServer.configuration.userContentController.addUserScript(mainJS)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        
        let monitor: JoyStickViewPolarMonitor = { report in
            if report.displacement > 0.0 {
                self.theta = String(format: "%.3f", report.angle)
                self.magnitude = String(format: "%.3f", report.displacement)
                // print(self.theta)
                // print(self.magnitude)
                
                let dict = [
                    "theta": self.theta,
                    "magnitude": self.magnitude
                ]
                let JSONData = try! JSONSerialization.data(withJSONObject: dict, options: [])
                var JSONString = String(data: JSONData, encoding: String.Encoding.utf8)!
                JSONString = JSONString.replacingOccurrences(of: "\n", with: "")
                
                // print("getJoystickData(\"\(JSONString)\");")
                
                
                self.WebServer.evaluateJavaScript("recieveJoystickData(\'\(JSONString)\');") { result, error in
                    guard error == nil else {
                        print(error!)
                        return
                    }
                }
            }
            else if report.displacement == 0.0 {
                self.WebServer.evaluateJavaScript("stopRobot()") { result, error in
                    guard error == nil else {
                        print(error!)
                        return
                    }
                }
            }
        }
        
        joyStick = makeJoystick(tintColor: UIColor.black, monitor: monitor)
        joyStick.movable = false
        joyStick.travel = 1.25
        joyStick.accessibilityLabel = "leftJoystick"
        joyStick.enableDoubleTapForFrameReset = false
    }
    
    private func makeJoystick(tintColor: UIColor, monitor: @escaping JoyStickViewPolarMonitor) -> JoyStickView {
        
        let xPos = view.frame.maxX - joystickSpan*2
        let yPos = view.frame.maxY - joystickSpan*2
        
        let frame = CGRect(origin: CGPoint(x: xPos, y: yPos), size: CGSize(width: joystickSpan, height: joystickSpan))
        let joystick = JoyStickView(frame: frame)
        
        if let baseIm = Bundle.main.path(forResource: "base3", ofType: "png"){
            let baseImage = UIImage(contentsOfFile: baseIm)!
            joystick.baseImage = baseImage
        }
        
        view.addSubview(joystick)
        joystick.monitor = .polar(monitor: monitor)
        joystick.alpha = 1.0
        joystick.baseAlpha = 0.75
        joystick.handleTintColor = tintColor
        joystick.colorFillHandleImage = true
        joystick.handleSizeRatio = 0.6
        
                
        return joystick
    }
}
