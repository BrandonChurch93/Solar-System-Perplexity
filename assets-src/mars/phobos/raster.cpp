#include <algorithm>
#include <cmath>

extern "C" void raster(int w, int h, int cols, int rows, const float *v, float *z, int *id, float *weights) {
    auto tri = [&](int a, int b, int c) {
        const float *p = v + a*3, *q = v + b*3, *r = v + c*3;
        const float dx = q[0]-p[0], dy = q[1]-p[1], ex = r[0]-p[0], ey = r[1]-p[1];
        const float area = dx*ey-dy*ex;
        if (std::abs(area)<1e-8f) return;
        const int x0 = std::max(0, int(std::ceil(std::min({p[0],q[0],r[0]})-.5f)));
        const int x1 = std::min(w-1, int(std::floor(std::max({p[0],q[0],r[0]})-.5f)));
        const int y0 = std::max(0, int(std::ceil(std::min({p[1],q[1],r[1]})-.5f)));
        const int y1 = std::min(h-1, int(std::floor(std::max({p[1],q[1],r[1]})-.5f)));
        for (int y=y0; y<=y1; ++y) for (int x=x0; x<=x1; ++x) {
            const float px = x+.5f-p[0], py = y+.5f-p[1];
            const float wb = (px*ey-py*ex)/area;
            const float wc = (dx*py-dy*px)/area;
            const float wa = 1-wb-wc;
            if (wa<-.00001f || wb<-.00001f || wc<-.00001f) continue;
            const float zz = wa*p[2]+wb*q[2]+wc*r[2];
            const int i = y*w+x;
            if (zz<=z[i]) continue;
            z[i]=zz;
            if (id) {
                id[3*i]=a; id[3*i+1]=b; id[3*i+2]=c;
                weights[3*i]=wa; weights[3*i+1]=wb; weights[3*i+2]=wc;
            }
        }
    };
    for (int i=0; i<rows-1; ++i) for (int j=0; j<cols-1; ++j) {
        const int a=i*cols+j,b=a+1,c=a+cols,d=c+1;
        tri(a,b,c);
        tri(b,d,c);
    }
}
