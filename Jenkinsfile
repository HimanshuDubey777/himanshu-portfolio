pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/HimanshuDubey777/himanshu-portfolio.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            echo 'Build successful!'
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """<p>Build Successful!</p>
                         <p><b>Job:</b> ${env.JOB_NAME}</p>
                         <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                         <p><b>Console Output:</b> <a href='${env.BUILD_URL}'>${env.BUILD_URL}</a></p>""",
                to: 'himanshu09ask@gmail.com',
                mimeType: 'text/html'
            )
        }
        failure {
            echo 'Build failed. Check logs above.'
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """<p>Build Failed!</p>
                         <p><b>Job:</b> ${env.JOB_NAME}</p>
                         <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                         <p><b>Console Output:</b> <a href='${env.BUILD_URL}'>${env.BUILD_URL}</a></p>""",
                to: 'himanshu09ask@gmail.com',
                mimeType: 'text/html'
            )
        }
    }
}
